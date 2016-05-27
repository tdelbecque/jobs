set.seed (1000)
T <- 363157
N <- 6000
s <- sample (T, 2*N)
g <- c (rep ('A1', N), rep ('A2', N))
for (v in c('A1', 'A2')) write.table (s [g == v], quote=FALSE, row.names=FALSE, col.names=FALSE, file=paste ('sample_', v, sep=''))

write.table (sample (T, T), quote=FALSE, row.names=FALSE, col.names=FALSE, file='shuffle')

s <- sample (1:10000)
write.table (s [1:5000], quote=FALSE, row.names=FALSE, col.names=FALSE, file='sample_G')
write.table (s [5001:10000], quote=FALSE, row.names=FALSE, col.names=FALSE, file='sample_I')
