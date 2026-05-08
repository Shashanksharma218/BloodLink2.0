const ok = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

const created = (res, data) => ok(res, data, 201);

const paginated = (res, data, { page, limit, total }) =>
  res.status(200).json({ success: true, data, meta: { page, limit, total } });

module.exports = { ok, created, paginated };
