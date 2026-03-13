(async () => {
  process.env.MONGO_URI = 'mongodb+srv://kunal_dbuser:9c2Eo4jXm7gbVFde@hazardwatchcluster.z2xmtgn.mongodb.net/?appName=Hazardwatchcluster';
  const { default: handler } = await import('./api/login.js');

  const req = { method: 'GET' };
  let status = 200;
  const res = {
    status: (s) => {
      status = s;
      return res;
    },
    json: (d) => {
      console.log('response', status, d);
      return d;
    },
    setHeader: () => {}
  };

  try {
    await handler(req, res);
  } catch (e) {
    console.error('handler threw', e);
  }
})();
