set.seed (2000)
T <- 363087
N <- 10000
s <- sample (T, 2*N)
g <- c (rep ('H1', N), rep ('H2', N))
for (v in c('H1', 'H2')) write.table (s [g == v], quote=FALSE, row.names=FALSE, col.names=FALSE, file=paste ('sample_', v, sep=''))

write.table (sample (T, T), quote=FALSE, row.names=FALSE, col.names=FALSE, file='shuffle')

#s <- sample (1:20000)
#write.table (s [1:10000], quote=FALSE, row.names=FALSE, col.names=FALSE, file='sample_M')
#write.table (s [1:10000], quote=FALSE, row.names=FALSE, col.names=FALSE, file='sample_N')
#write.table (s [10001:20000], quote=FALSE, row.names=FALSE, col.names=FALSE, file='sample_M2')
#write.table (s [10001:20000], quote=FALSE, row.names=FALSE, col.names=FALSE, file='sample_N2')


