library (randomForest)

nthBiggerVal <- function (x, n) x [order (-x)] [n]
aboveNthBigger <- function (x, n) x >= nthBiggerVal (x, n)

nthBiggerValFun <- function (x) {
    o <- order (-x)
    function (n) x [o [n]]
}

aboveNthBiggerFun <- function (x) {
    fun <- nthBiggerValFun (x)
    function (n) x >= rep (fun (n), each=length (x))
}

###
### plots the precision curve w.r.t. the size of the
### selected population (ordered according to decreasing
### score)
###
### - binflag  = response to learn, typically the click flag
### - score    = the predicted response expectancy
### - n        = nb of points to plot
### - step     = coarseness of the curve: the selected population is increased
###     with 'step' new cases at each step
### - target   = to draw the target line
### -bootstrap = setting to compute confidences intervals computed on the
###     test set
###     - B      = nb of bootstrap replications
###     - bounds = bootstrap percentiles to compute
###
plotPrecCurve <- function (
    binflag, score, n=100, step=100,
    target=list (value=0.1, col='green'),
    bootstrap=list (B=200, bounds=c(0.05 ,0.95), col='red')) {

    ## computes the precision curve
    p <- precCurve (binflag=binflag, score=score, n=n, step=step)
    plot (p, type='l', col='black',
          ylab="precision", xlab="population size (in hundreds)",
          main="precision growth", ylim=c(0,1))
    if (! is.null (target)) 
        abline (h=target$value, col=target$col)
    if (! is.null (bootstrap)) {
        if (is.null (bootstrap$B)) bootstrap$B <- 50
        if (is.null (bootstrap$bounds)) bootstrap$bounds <- c (0.1, 0.9)
        if (is.null (bootstrap$col)) bootstrap$col <- 'red'
        ## compute the bootstraped precisions
        b <- bootstrapPrecCurve (binflag=binflag, score=score, n=n, step=step,
                                 boot=bootstrap$B)
        ## for each required percentile, compute it ('apply'), and plot it ('lines')
        for (x in bootstrap$bounds) {
            lines (apply (b, MARGIN=1, FUN=quantile, prob=x), col=bootstrap$col)
        }
    }
}

### 
### computes the precision curve w.r.t. the size of the
### selected population (ordered according to decreasing
### score)
###
### - binflag  = response to learn, typically the click flag
### - score    = the predicted response expectancy
### - n        = nb of points to plot
### - step     = coarseness of the curve: the selected population is increased
###
precCurve <- function (binflag, score, n=100, step=100) {
    fun <- aboveNthBiggerFun (score)
    ret <- c ()
    for (i in 1:n) {
        u <- i*step
        tbl <- table (binflag, fun (u))
        if (ncol (tbl) == 2)
            ret <- c (ret, t (t (tbl) / apply (tbl, MARGIN=2, FUN=sum)) [2,2])
        else
            ret <- c (ret, 0)
    }
    ret
}

precCurve2 <- function (binflag, score, n=100, step=100) {
    m <- matrix (aboveNthBiggerFun (score) (step*(1:n)), ncol=n)
    apply (m, 2, function (x) sum (x*binflag))/apply(m, 2, sum)
}
    
### 
### computes bootstrap replications of the precision curve w.r.t. the size of the
### selected population (ordered according to decreasing
### score)
###
### - binflag  = response to learn, typically the click flag
### - score    = the predicted response expectancy
### - n        = nb of points to plot
### - step     = coarseness of the curve: the selected population is increased
### - bootstrap = nb of bootstrap replications
###
bootstrapPrecCurve <- function (binflag, score, n=100, step=100, bootstrap=50) {
    xs <- c ();
    for (i in 1:bootstrap) {
        s <- sample (seq_along(binflag), length (binflag), TRUE)
        xs <- c (xs, precCurve2 (binflag [s], score [s], n, step))
    }
    matrix (xs, ncol=bootstrap)
}

###
### create random samples from the data
### - data = just there to get the nb of cases ...
### - seed = useful to allow the run to be repeteable
###
### 'split' component of the return value is a three'valued' vector:
###   split = 1 => training subset
###   split = 2 => test subset
###   split = 3 => validation subset
###
### The test subset if useful when extra parameters need to be set after the
### main training stage is over. For example in the case of PLS regression,
### one wants to first compute the factors and  loadings, then select a good
### subspace dimension; this selection shoild use the test subset.
###
### in the case of random forest, it is possible to use 'split %in% 1:2' to define
### the training subset.
###
createSamples <- function (data, seed) {
    if (! missing (seed)) set.seed (seed)
    trainprop <- 60
    testprop <- 20
    validprop <- 20
    split <- sample (1:3, nrow(data), TRUE, c (trainprop, testprop, validprop))
    
    list (split=split, data=data)
}

###
### set of processes to create graphs.
### this illustrates the use of the functions above.
###
do_it <- function () {
    ret <- list ()
    set.seed (1)

    ## read the log data
    ret$data <- data <- read.csv('data.csv', sep=';')
    
    ## this is too dangerous, get rid of it first !
    data$idx <- NULL

    ## create dummy variables for countries and get rid of the original variables
    data.design1 <-
        data.frame (data,
                    model.matrix ( ~ acountry + jcountry, data=data) [,-1])
    data.design1$acountry <- data.design1$jcountry <- NULL

    ## create training sample
    m <- createSamples (data, 1)
    ret$split <- m$split
    
    ## Features Importances
    rf <- randomForest (as.factor(click) ~ . - open,
                        data=data.design1 [ m$split %in% 1:2, ],
                        mtry=5, ntree=10, importance=TRUE, do.trace=1)
    o <- order (-rf$importance [,3])
    ret$importance <- rf$importance [o,]

###    png ('importance.png') # activate it to export the graph
    par (mfrow=c(2,1))
    plot (rf$importance [o, 3],
          type='l',
          ylab="mean decrease accuracy", xlab="feature nb",
          main="Sorted feature importances")
    plot (rf$importance [o [1:40], 3],
          type='l',
          ylab="mean decrease accuracy", xlab="feature nb",
          main="Sorted feature importances (top 40)")
###    dev.off () # activate it to export the graph

    ## models on various size of predictor subset
    ## top 30 features

    ## slices the data
    ret$data.select30 <- data.select30 <- data.design1 [, c("click", rownames (rf$importance [o [1:30],]))]
    ## learn the model on the train subset
    ret$rf.select30 <-
        rf.select30 <-
            randomForest (as.factor(click) ~ ., mtry=5, ntree=200,
                          data=data.select30 [ m$split %in% 1:2,], do.trace=1)
    ## predict on the validation subset
    ret$p.select30 <-
        p.select30 <-
            predict (rf.select30, newdata=data.select30 [ m$split == 3,], type="prob") [,2]

    ## top 10 features
    ret$data.select10 <-
        data.select10 <-
            data.design1 [, c("click", rownames (rf$importance [o [1:10],]))]
    ret$rf.select10 <-
        rf.select10 <-
            randomForest (as.factor(click) ~ ., mtry=5, ntree=200,
                          data=data.select10 [ m$split %in% 1:2,], do.trace=10)
    ret$p.select10 <-
        p.select10 <-
            predict (rf.select10, newdata=data.select10 [ m$split == 3,], type="prob") [,2]

### png ('rf-perfo-30.png') # activate to export the graph
    par (mfrow=c(2,1))
    plot (precCurve (data.select30$click [m$split == 3], p.select30, n=100, step=100),
          type='l', ylab="precision", xlab="population size (in hundreds)",
          main="precision growth", ylim=c(0,0.5), sub='random forest; top 30 features')
    abline (h=(table (data.select30$click [m$split == 3])/sum(m$split == 3))[2], col='red')
    abline (h=0.1, col='green')

    plot (precCurve (data.select10$click [m$split == 3], p.select10, n=100, step=100),
          type='l', ylab="precision", xlab="population size (in hundreds)",
          main="precision growth", ylim=c(0,0.5), sub='random forest; top 10 features')
    abline (h=(table (data$click [m$split == 3])/sum(m$split == 3))[2], col='red')
    abline (h=0.1, col='green')
### dev.off () # activate to export the graph

    ## plot the precision curve with bootstrap CI (default bootstrap settings)
    x11 ()
    plotPrecCurve (data.select30$click [m$split == 3], p.select30)
    legend (50, 0.5, c('precision', '', '5% & 95% bootstrap CI (200 rep)'), col = c('black', 'white', 'red'), lty=1, cex=0.8)
    
    ret
}

###
### train random forest on various random settings.
### This is useful in order to test the robustness of the learning process
### w.r.t the setting of parameters such as the training subset, the number of trees
### in the forest and so on.
###
### - primaryResample = do we want the data to be resampled with replacement before each
###    run ?
### - B = number of models to learn
### - params = to allow some randomness in the structures of the forest
###    - ntrees: at each run the ntree parameter will be sampled from this
###    - ntrys : at each run the ntry parameters will be sampled from this
###
### Example:
###
### y <- robustTestTraining (data.select30, B=100, params=list(ntrees=150:250, ntrys=2:10))
### plot (apply (y$Q, MARGIN=1, FUN=mean), type='l', ylim=c(0, 1))
### lines (apply (y$Q, MARGIN=1, FUN=quantile, prob=0.05), col='red')
### lines (apply (y$Q, MARGIN=1, FUN=quantile, prob=0.95), col='red')
###
robustTestTraining <- function (dataOrigin, primaryResample=TRUE, B=100,
                                seed, params=list(ntrees=200, ntrys=5)) {
    if (! missing (seed)) set.seed (seed)
    if (missing (params)) params <- list ()
    ntrys <- if (is.null (params$ntrys)) 5 else params$ntrys
    ntrees <- if (is.null (params$ntrees)) 200 else params$ntrees
    P <- c ()
    Q <- c ()
    S <- c ()
    NTREES <- c ()
    NTRYS <- c ()
    for (b in (1:B)) {
        data <-
            if (primaryResample) ## resample the data in a bootstrap fashion
                dataOrigin [sample (nrow(dataOrigin), nrow(dataOrigin), TRUE),]
            else
                dataOrigin
        
        ntree <- if (length (ntrees) > 1) sample (ntrees, 1) else ntrees
        ntry <- if (length (ntrys) > 1) sample (ntrys, 1) else ntrys
        cat ('b =', b, 'ntree =', ntree, 'ntry =', ntry, '\n')
        m <- createSamples (data)
        S <- c (S, m$split)
        n <- randomForest (as.factor(click) ~ ., mtry=ntry, ntree=ntree,
                           data=data [ m$split %in% 1:2,])
        p <- predict (n, newdata=data [ m$split == 3,], type="prob") [,2]
        q <- precCurve (data$click [m$split == 3], p)
        P <- c (P, p)
        Q <- c (Q, q)
        NTREES <- c (NTREES, ntree)
        NTRYS <-  c (NTRYS, ntry)
        gc ()
    }
    list (P=P, Q=matrix (Q, ncol=B), S=S, NTREES=NTREES, NTRYS=NTRYS)
}

exportModelTable <- function (m, file) {
    mtbl <- NULL
    for (i in 1:m$ntree) {
        tree <- getTree (m,i)
        mtbl <- rbind (mtbl, cbind (i, 1:nrow (tree), tree))
    }
    write.table (mtbl, quote=FALSE, row.name=FALSE, col.name=FALSE, sep='\t',
                 file=file)

}
