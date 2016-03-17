N <- 24000
s <- sample (1:343357, 2*N)
g <- c (rep ('A', N), rep ('E', N))
for (v in c('A', 'E')) write.table (s [g == v], quote=FALSE, row.names=FALSE, col.names=FALSE, file=paste ('sample_', v, sep=''))
