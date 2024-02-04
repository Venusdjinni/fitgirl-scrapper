require('dotenv').config({path: '../.env'});
const MONGODB_URL = process.env.MONGODB_URL;
const START_AT = Number.parseInt(process.env.START_AT);
const END_AT = Number.parseInt(process.env.END_AT);
const BASE_URL = process.env.BASE_URL;
const EXCLUSION_LIST = process.env.EXCLUSION_LIST.split(',');

const axios = require('axios');
const mongoose = require('mongoose');
const {JSDOM} = require("jsdom");
const {AxiosError} = require("axios");

const getPage = function (page) {
    let url = BASE_URL + '/page/' + page;

    return new Promise(function (resolve, reject) {
        axios.get(url).then(function (response) {
            const dom = new JSDOM(response.data);
            let elements = dom.window.document
                .querySelector('body')
                .querySelector('div#page')
                .querySelector('div#main')
                .querySelector('div#main-content')
                .querySelector('div#primary')
                .querySelector('div#content')
                .getElementsByTagName('article');

            let repacks = [];
            for (let i = 0; i < elements.length; i++) {
                let element = elements[i];
                // check if article is a repack
                if (
                    element.classList.contains('category-lossless-repack') &&
                    !EXCLUSION_LIST.includes(element.id)
                )
                    repacks.push(getRepack(elements[i]));
            }
            resolve(repacks);
        }, async function (error) {
            if (error instanceof AxiosError && error.response.status === 403) {
                // on attend et on ressaie
                console.log(`page ${page} is blocking. Retrying in 5s...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
                getPage(page).then(resolve, reject);
            } else {
                reject(error);
            }
        });
    });
};

const keyGenre = 'Genres/Tags: ';
const keyCompany = 'Company: ';
const keyLanguages = 'Languages: ';
const keyOriginalSize = 'Original Size: ';
const keyRepackSize = 'Repack Size: ';

const getRepack = function (tag) {
    let repack = {};
    repack.post_id = tag.id;
    repack.url = tag
        .querySelector('header')
        .querySelector('h1')
        .querySelector('a').href;
    repack.date = tag
        .querySelector('header')
        .getElementsByClassName('entry-meta')[1] // the meta containing date and comments
        .querySelector('span.entry-date')
        .querySelector('a')
        .querySelector('time').dateTime;
    repack.date = new Date(repack.date).toISOString();
    repack.id = tag
        .querySelector('div.entry-content')
        .querySelector('h3')
        .querySelector('span')
        // remove the #
        .textContent.substring(1);
    repack.version = tag
        .querySelector('div.entry-content')
        .querySelector('h3')
        .querySelector('strong')
        .querySelector('span')
        ?.textContent;
    let nameVersion = tag
        .querySelector('div.entry-content')
        .querySelector('h3')
        .querySelector('strong')
        .textContent;
    repack.name = repack.version == null
        ? nameVersion
        : nameVersion.substring(0, nameVersion.indexOf(repack.version) - 1);
    repack.image = tag
        .querySelector('div.entry-content')
        .querySelector('p')
        //.querySelector('a') // is not always present
        .querySelector('img')
        .src;
    let innerHtml = tag
        .querySelector('div.entry-content')
        .querySelector('p')
        .innerHTML;
    let info = innerHtml
        .replaceAll('\n', '')
        .substring(innerHtml.indexOf('</a>') + 4); // contains all the info section
    for (let line of info.split('<br>')) {
        if (line.startsWith(keyGenre))
            repack.genres = new JSDOM(line.substring(keyGenre.length))
                .window.document.body.textContent.split(', ');
        else if (line.startsWith(keyCompany))
            repack.company = new JSDOM(line.substring(keyCompany.length))
                .window.document.body.textContent;
        else if (line.startsWith(keyLanguages))
            repack.languages = new JSDOM(line.substring(keyLanguages.length))
                .window.document.body.textContent.split('/');
        else if (line.startsWith(keyOriginalSize))
            repack.original_size = new JSDOM(line.substring(keyOriginalSize.length))
                .window.document.body.textContent;
        else if (line.startsWith(keyRepackSize))
            repack.repack_size = new JSDOM(line.substring(keyRepackSize.length))
                .window.document.body.textContent;
    }

    return repack;
};

const main = function () {
    mongoose.connect(
        MONGODB_URL,
        {
            retryWrites: true,
            writeConcern: 'majority'
        }
    ).then(async function () {
        const Repack = require('../models/repack');

        let startDate = new Date();
        for (let i = START_AT; i < END_AT; i++) {
            console.log(`scrapping page ${i}...`);
            let repacks = await getPage(i);
            console.log(`page ${i} scrapped. ${repacks.length} items`);
            console.log(`saving entries...`);
            try {
                await Repack.bulkSave(
                    repacks.map((r) => Repack.fromData(r)),
                    {ordered: false}
                );
            } catch (e) {
                if (e.code === 11000) {
                    // duplicate error. Do not do anything
                } else {
                    throw e;
                }
            }
        }
        console.log(`scrapping done in ${new Date() - startDate} ms`);
    });
};

main();