const Promise = require('bluebird')
const buildWhere = (object, where)=>{
  if(where.op === "=="){
    return object.where(`${where.field}`, `${where.value}`);
  }
  if(where.op === "!=" || where.op === "<>" || where.op === "<" || where.op === ">"){
    return object.where(`${where.field}`, `${where.op}`, `${where.value}`);
  }
  if(where.op === "null"){
    return object.whereNull(`${where.field}`)
  }
  if(where.op === "notNull"){
    return object.whereNotNull(`${where.field}`)
  }
  if(where.op === "between") {
    return object.whereBetween(`${where.field}`, where.value)
  }
  if(where.op === "notBetween"){
    return object.whereNotBetween(`${where.field}`, where.value)
  }
  if(where.op === "in"){
    return object.whereIn(`${where.field}`, where.value)
  }
  if(where.op === "notIn"){
    return object.whereNotIn(`${where.field}`, where.value)
  }
  if(where.op === 'not'){
    return object.whereNot(where.value)
  }
}
exports.run = async function(model, query) {
  var baseQuery = model.query();
  var queryOptions = query
  if (queryOptions.hasOwnProperty('fields')) {
    for (var f of queryOptions.fields) {
      baseQuery.select(`${f}`);
    }
  }

  if (queryOptions.hasOwnProperty('where')) {
    for (var w of queryOptions.where) {
      buildWhere(baseQuery, w)
    }
  }
  
  if (queryOptions.hasOwnProperty('with')) {
    await Promise.each(queryOptions.with, (w)=>{
      return baseQuery.with(`${w.table}`, (builder) => {
        if (w.hasOwnProperty('fields')) {
          builder.select(w.fields);
        }
        if (w.hasOwnProperty('where')) {
          for (var v of w.where) {
            buildWhere(builder, v)
          }
        }
      }).fetch();
    })
  }

  return await baseQuery.fetch();
}
