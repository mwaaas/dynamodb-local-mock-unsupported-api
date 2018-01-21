const koa = require('koa');
const body = require('koa-json-body')
const proxy = require('koa-proxy');
const app = new koa();

const tableTtlMap = {};

app.use(body({ limit: '10kb', fallback: true }))

app.use((ctx, next) => {
  if (ctx.header['x-amz-target'] === 'DynamoDB_20120810.UpdateTimeToLive') {
    tableTtlMap[ctx.request.body['TableName']] = {
      'AttributeName': ctx.request.body['TimeToLiveSpecification']['AttributeName'],
      'Status': ctx.request.body['TimeToLiveSpecification']['Enabled']
    };
    ctx.body = {
      'TimeToLiveSpecification': ctx.request.body['TimeToLiveSpecification']
    };
  }
  else if (ctx.header['x-amz-target'] === 'DynamoDB_20120810.DescribeTimeToLive') {
    if (!tableTtlMap[ctx.request.body['TableName']]) {
      ctx.body = {
        'TimeToLiveDescription': {
          'TimeToLiveStatus': 'DISABLED'
        }
      };
    } else {
      ctx.body = {
        'TimeToLiveDescription': {
          'AttributeName': tableTtlMap[ctx.request.body['TableName']]['AttributeName'],
          "TimeToLiveStatus": tableTtlMap[ctx.request.body['TableName']]['Status'] ? 'ENABLED' : 'DISABLED'
        }
      };
    }

  }
  else if (ctx.header['x-amz-target'] === 'DynamoDB_20120810.TagResource' || ctx.header['x-amz-target'] === 'DynamoDB_20120810.UntagResource') {
    ctx.status = 200;
  }
  else if (ctx.header['x-amz-target'] === 'DynamoDB_20120810.ListTagsOfResource') {
    ctx.body = {};
  }
  else if (ctx.path === '/shell') {
    ctx.redirect('shell/');
  }
  else {
    return next().then(function () { });
  }
});

app.use(proxy({
  host: 'http://localhost:45670'
})).listen(4567);

console.log('started server at http://localhost:4567');
