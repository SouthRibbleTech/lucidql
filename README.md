# lucidql

`npm install @srtech/lucidql`

## About lucidql
lucidql allows you to query an AdonisJS Lucid backed database from a client using structured JSON in a post request. 
The principle is very simple and similar to GraphQL which is where my inspiration for lucidql came from 

## What is the benefit of lucidql

**Data Structure**

No need to setup and maintain your data structure, LUCID already knows all about this. 
Lucid also knows all about your table relationships, so getting related data is very simple.


**Only get the data you need**

lucidql allows you to select only the fields you want to see in both the main table and the related tables

**Faimilar Knex syntact for filtering**

If your already familier with KnexJS then wirting client queries for lucidql will be a breeze.

**Easy to use with a simple POST request**

Accessing your data from the client is as easy as making a POST request and passing some JSON to the server.

## Getting Started
### install lucidql
`npm i @srtech/lucidql`

### setup your Adonis application and create models and a controller
* Setup your models and relationships as you would normally. Nothing special here
* Create a new controller, you can call it anything you want and set it up like in the example below, but referncing your own models

You controller might look something like this.

```
//App/Controllers/Http/LucidQlController.js

const lucidql = require('@srtech/lucidql')

const PurchaseOrder = use('App/Models/PurchaseOrder')
const PurchaseOrderLines = use('App/Models/PurchaseOrderLine')

const classes = {
	__proto__: null, // to avoid people being able to pass something like `toString`
  PurchaseOrder,
  PurchaseOrderLines
};

class LucidQlController {

  async query({ request }) {
    var { baseTable, query } = request.all()
    return lucidql.run(classes[baseTable], query)
  }
}

module.exports = LucidQlController
```

Note: Only Models that are imported and included in the classes object will be visible to lucidql as base tables for queries.

setup a new route in `App/start/routes.js`

`Route.post('/api/lucidql', 'LucidQlController.query')`


### Querying data

Simply point your client i.e Axios or Postman etc at your route and send a structured JSON object to request your data.

The structure of the JSON object you send needs to be in the following format

```
{
  "baseTable": "PurchaseOrder",
  "query": {
    "where": [
      {
        "field": "PurchaseOrder", 
        "value":"POC001460",
        "op":"=="
      }
    ],
    "fields": ["PurchaseOrder", "ShipFromAddress", "Currency"],
    "with": [
      {
        "table": "lines",
        "fields": ["PurchaseOrder", "Position", "Item", "Price"],
        "where": [
          {
            "field": "Position",
            "value": [5, 8],
            "op": "between"
           }	
        ]
      }
    ]
  }
}
```

The above query is the same as running the following LUCID query in your controller.

```
return await PurchaseOrder.query().where('PurchaseOrder', "POC001460")
    .with('lines', (builder)=>{
      builder.whereBetween('Position', [5, 9]).select(["PurchaseOrder", "Position", "Item", "Price"])
    })
    .fetch()
```

## baseTable

Acceptes a String
This should match of the models you specified in the classes object you created in your controller

## query

Accepts a JSON object
Although the `query` property is required, it can be left empty. For example, this will return all records from the PurchaseOrder table.

```
{
  "baseTable": "PurchaseOrder",
  "query": {}
}
```

The query property accepts two child properties

* fields
* where
* with

### fields

Accepts an Array of Strings

This is the same as using .select(...) in a normal LUCID query. It is the fields that you want to include from your baseTable. 

**important** In order for relations to work using the `with` property (see below) you must incldue the fields that form the foreign key relationship, otherwise LUCID will not be able to make the relationship.

### where

Acceptes an Array of Objects

The where property that is a direct child of `"query"` will filter the records from your base table, the above example will restrict the base table to returning one record where PurchaseOrder == 'POC001460'

the structure of each condition is setup as follows

```
{
  "field": <string>,
  "value": <string, int, float, object, array>,
  "op": (many options that mostly map to Knex operators. See below for more details)
}
```
You can add multiple conditions by simply adding more objects to the array.

### with

Accepts an array of Objects

Just as if you were using LUCID directly in your controller, `with` allows you to join relations to your baseTable

The structure of with is an array of objects, with each object desribing filters and fields to include.

```
"with": [
  {
    "table": "lines",
    "fields": ["PurchaseOrder", "Position", "Item", "Price"],
    "where": [
      {
        "field": "Position",
        "value": [5, 8],
        "op": "between"
      }	
    ]
  }
]
```

**table**
Accepts a String
this must match the name of the relation you have setup in your model. i.e. 

```
lines() {
  return this.hasMany('App/Models/PurchaseOrderLine', 'PurchaseOrder', 'PurchaseOrder')
}
```

in the case above you can see that `lines` is the name of our relation in the model and it is what was used to name the relation in the JSON object.

You can add multiple relationships by simplying adding more objects to the array.

**fields** - Optional
Accepts an Array of Strings

Works identically to the how the fields property is described above for the baseTable, but will limit the fields returned from your relationship, **Important** You must include in the list the field that forms part of the foreign key relationship

If you ommit the fields property, all fields will be returned for this relationship

**where**

Accepts an Array of Objects

Each object in this array is used to filter the results from related table. It works in exactly the same way as described above for the where property for the basetable.


## where op

As mentioned above a where property consists of an Array of Objects, each object describing a where condition, each of these objects must have an `op` property. Below is a list of the supported op's

### ==

```
"where": [
  {
    "field": "Position",
    "value": 8,
    "op": "=="
  }	
]
```
Would return rows where `Position` is equal to 8

### <> / !=

```
"where": [
  {
    "field": "Position",
    "value": 8,
    "op": "!="
  }	
]
```
Would return rows where `Position` is not equal to 8


### <

```
"where": [
  {
    "field": "Position",
    "value": 8,
    "op": "<"
  }	
]
```
Would return rows where `Position` is less than 8

### >

```
"where": [
  {
    "field": "Position",
    "value": 8,
    "op": ">"
  }	
]
```
Would return rows where `Position` is greater than 8

### between

```
"where": [
  {
    "field": "Position",
    "value": [4, 8],
    "op": "between"
  }	
]
```
Would return rows where `Position` between 4 and 8

### notBetween

```
"where": [
  {
    "field": "Position",
    "value": [4, 8],
    "op": "notBetween"
  }	
]
```
Would return rows where `Position` is not between 4 and 8

### in

```
"where": [
  {
    "field": "Position",
    "value": [4, 5, 6, 7, 8],
    "op": "in"
  }	
]
```
Would return rows where `Position` is one of 4 or 5 or 6 or 7 or 8

### notIn

```
"where": [
  {
    "field": "Position",
    "value": [4, 5, 6, 7, 8],
    "op": "notIn"
  }	
]
```
Would return rows where `Position` is NOT one of 4 or 5 or 6 or 7 or 8

### not

Using `not` the `field` property can be omitted

```
"where": [
  {
    "value": {
      "Position": 8,
      "Currency": "USD"
    },
    "op": "not"
  }	
]
```
Would return rows where `Position` is not 8 and `Currency` is not "USD"

### null
Using `null` the `value` property can be omitted
```
"where": [
  {
    "field": "Position",
    "op": "null"
  }	
]
```
Would return rows where `Position` is null

### notNull
Using `notNull` the `value` property can be omitted
```
"where": [
  {
    "field": "Position",
    "op": "notNull"
  }	
]
```
Would return rows where `Position` is not null

