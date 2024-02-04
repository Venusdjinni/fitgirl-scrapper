const express = require('express');
const router = express.Router();
const Repack = require('../models/repack');

router.get('/search', function (req, res) {
    let term = req.query.term;
    let fields = req.query.fields;
    let page = req.query.page ? Number.parseInt(req.query.page) : 0;
    let size = req.query.size ? Number.parseInt(req.query.size) : 10;

    if (!fields instanceof Array)
        return res.status(400).send('fields must be an array');

    let query = {$or: []};
    for (let field of fields) {
        let entry = {};
        entry[field] = new RegExp(term, 'i');
        query.$or.push(entry);
    }

    Repack.search(query, page, size).then(async function (results) {
        let total = await Repack.searchCount(query);
        let r = {
            repacks: results,
            page: page,
            size: Math.min(size, total),
            total: total
        };
        return res.send(r);
    }, function (err) {
        console.log(err);
        return res.status(500);
    });
});

module.exports = router;