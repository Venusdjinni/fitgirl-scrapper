const mongoose = require("mongoose");

const repackSelect = '-post_id';

const Repack = mongoose.model(
    "repacks",
    new mongoose.Schema(
        {
            date: {type: String},
            post_id: {type: String, unique: true},
            id: {type: String},
            name: {type: String},
            version: {type: String},
            image: {type: String},
            genres: [{type: String}],
            company: {type: String},
            languages: [{type: String}],
            original_size: {type: String},
            repack_size: {type: String},
            url: {type: String},
        },
        {
            statics: {
                fromData (data) {
                    return new Repack(data);
                },
                search(query, page, size) {
                    return Repack.find(query)
                        .skip(page * size)
                        .limit(size)
                        .select(repackSelect)
                        .exec();
                },
                searchCount(query) {
                    return Repack.find(query).countDocuments();
                }
            },
        }
    ),
);

module.exports = Repack;