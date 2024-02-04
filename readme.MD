ENV variables

MONGODB_URL: MongoDB connection string

BASE_URL: The Fitgirl site you want to scrap

START_AT: The first page index to start with. Inclusive

END_AT: The last page index to read. Exclusive

EXCLUSION_LIST: Some publications on the site are admin messages instead of real games. The parser is not able to manage them
and so should be excluded. The current one known are post-3778,post-2736,post-27485