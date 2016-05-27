library (randomForest)

data <- read.table ('filtered_pair_profiles.csv', h=TRUE, sep='\t', quote='')
load ('rf.RDATA')
p <- predict (l$model, newdata=data, type='prob') [,2]
q <- tapply (1-p, data$author_email, prod)
write.table (names (sort (q)), quote=FALSE, row.names=FALSE, col.names=FALSE, file='ml-sorted-emails-1')
