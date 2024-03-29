import HttpErrors from 'http-errors'
import {
  query as Q,
  values as V,
  errors as FaunaErrors,
} from 'faunadb'
import { WithSecret, mergeWithRef } from '../../common'
import * as Db from '../../db'
import {
  Order,
  OrderChange,
  OrderedItemInput,
  OrderStatus,
} from './order.type'

export interface UpdateOrderInput extends WithSecret {
  orderRef: string
  payload: Pick<Order, 'status'>
}

interface ListCustomerOrdersInput {
  secret?: string
  customerRef?: string
}

const mergeOrderWithRef = mergeWithRef({ refFields: ['customerRef'] })

export const createOrder = async ({
  items,
  secret,
}: Record<'items', OrderedItemInput[]> & WithSecret) => {
  const customerRef = await Db.client.query(Q.CurrentIdentity(), {
    secret,
  })

  const productRefAndQuantities = items.map(
    ({ productRef, quantity }) => ({
      productRef: Q.Ref(Q.Collection(Db.PRODUCTS), productRef),
      quantity,
    }),
  )

  const remapProductRefToProductDoc = Q.Lambda(
    'productRefAndQuantity',
    {
      product: Q.Get(
        Q.Select(['productRef'], Q.Var('productRefAndQuantity')),
      ),
      // Just pass through
      quantity: Q.Select(
        ['quantity'],
        Q.Var('productRefAndQuantity'),
      ),
    },
  )

  const decrementQuantityForProduct = Q.Lambda(
    'productAndQuantity',
    Q.Let(
      {
        product: Q.Select(['product'], Q.Var('productAndQuantity')),
        productRef: Q.Select(['ref'], Q.Var('product')),
        availableQuantity: Q.Select(
          ['data', 'quantity'],
          Q.Var('product'),
        ),
        requestedQuantity: Q.Select(
          ['quantity'],
          Q.Var('productAndQuantity'),
        ),
        updatedQuantity: Q.Subtract(
          Q.Var('availableQuantity'),
          Q.Var('requestedQuantity'),
        ),
      },
      Q.If(
        Q.GTE(Q.Var('updatedQuantity'), 0),
        Q.Update(Q.Var('productRef'), {
          data: {
            quantity: Q.Var('updatedQuantity'),
          },
        }),
        Q.Abort(`Insufficient product's quantity`),
      ),
    ),
  )

  const remapProductAndQuantityToOrderedItem = Q.Lambda(
    'productAndQuantity',
    {
      productRef: Q.Select(
        ['product', 'ref'],
        Q.Var('productAndQuantity'),
      ),
      quantity: Q.Select(['quantity'], Q.Var('productAndQuantity')),
      price: Q.Select(
        ['product', 'data', 'price'],
        Q.Var('productAndQuantity'),
      ),
    },
  )

  const createOrderFlow = Q.Let(
    {
      productAndQuantities: Q.Map(
        productRefAndQuantities,
        remapProductRefToProductDoc,
      ),
    },
    Q.Do(
      Q.Map(
        Q.Var('productAndQuantities'),
        decrementQuantityForProduct,
      ),
      Q.Create(Q.Collection(Db.ORDERS), {
        data: {
          customerRef,
          status: OrderStatus.ORDERED,
          items: Q.Map(
            Q.Var('productAndQuantities'),
            remapProductAndQuantityToOrderedItem,
          ),
          orderedAt: Q.Now(),
        },
      }),
    ),
  )

  return Db.client
    .query<V.Document<Order>>(createOrderFlow)
    .then(mergeOrderWithRef)
    .catch(err =>
      Promise.reject(
        err instanceof FaunaErrors.BadRequest
          ? new HttpErrors.BadRequest(
              ((err as unknown) as Record<
                'description',
                string
              >).description,
            )
          : err,
      ),
    )
}

export const updateOrder = ({
  secret,
  orderRef,
  payload: { status },
}: UpdateOrderInput) => {
  const updateOrderQuery = Q.Update(
    Q.Ref(Q.Collection(Db.ORDERS), orderRef),
    {
      data: { status },
    },
  )

  return Db.client
    .query<V.Document<Order>>(updateOrderQuery, {
      secret,
    })
    .then(mergeOrderWithRef)
}

export const listCustomerOrders = ({
  secret,
  customerRef,
}: ListCustomerOrdersInput) => {
  const ref =
    customerRef === 'current'
      ? Q.CurrentIdentity()
      : Q.Ref(Q.Collection(Db.CUSTOMERS), customerRef)
  const listCustomerOrders = Q.Map(
    Q.Paginate(Q.Match(Q.Index(Db.ORDERS_SEARCH_BY_CUSTOMER), ref)),
    Q.Lambda(['_', 'ref'], Q.Get(Q.Var('ref'))),
  )

  return Db.client
    .query<V.Page<V.Document<Order>>>(listCustomerOrders, {
      secret,
    })
    .then(({ data }) => ({
      data: data.map(mergeOrderWithRef),
    }))
}

export const listOrderChanges = ({
  secret,
  orderRef,
}: WithSecret & Record<'orderRef', string>) => {
  const listOrderChanges = Q.Filter(
    Q.Select(
      ['data'],
      Q.Paginate(Q.Events(Q.Ref(Q.Collection(Db.ORDERS), orderRef))),
    ),
    Q.Lambda('doc', Q.ContainsPath(['data', 'status'], Q.Var('doc'))),
  )

  const formatChanges = (items: OrderChange[]) =>
    items.map(({ ts, data }) => ({
      status: data.status,
      at: new Date(Math.round(ts / 1000)),
    }))

  return Db.client
    .query<OrderChange[]>(listOrderChanges, {
      secret,
    })
    .then(formatChanges)
    .catch(err =>
      Promise.reject(
        err instanceof FaunaErrors.PermissionDenied
          ? new HttpErrors.NotFound()
          : err,
      ),
    )
}
