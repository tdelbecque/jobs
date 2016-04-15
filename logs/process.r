library (pls)
library (randomForest)

preliminary <- function () {
    data <- read.csv('data.csv', sep=';')
    data$idx <- NULL
    open <- data [ data$open == 1,]
    open$open <- NULL
    set.seed (1)
    learnsize <- 50000
    learnidx <- sample (1:nrow(open), learnsize)
    testidx <- seq (1, nrow(open)) [-learnidx]
    
    learndb <- open [learnidx,]
    testdb <- open [testidx,]

    data.design1 <- data.frame (data, model.matrix ( ~ acountry + jcountry, data=data) [,-1])
    data.design1$acountry <- data.design1$jcountry <- NULL

    ## Features Importances
    rf <- randomForest (as.factor(click) ~ . - open, data=data.design1 [ m$split %in% 1:2, ], mtry=5, ntree=10, importance=TRUE, do.trace=1)
    o <- order (-rf$importance [,3])
    
    png ('importance.png')
    par (mfrow=c(2,1))
    plot (rf$importance [o, 3], type='l', ylab="mean decrease accuracy", xlab="feature nb", main="Sorted feature importances")
    plot (rf$importance [o [1:40], 3], type='l', ylab="mean decrease accuracy", xlab="feature nb", main="Sorted feature importances (top 40)")
    dev.off ()

    ## models on various size of predictor subset 
    data.select30 <- data.design1 [, c("click", rownames (rf$importance [o [1:30],]))]
    rf.select30 <- randomForest (as.factor(click) ~ ., mtry=5, ntree=200, data=data.select30 [ m$split %in% 1:2,], do.trace=1)
    p.select30 <- predict (rf.select30, newdata=data.select30 [ m$split == 3,], type="prob") [,2]

    data.select10 <- data.design1 [, c("click", rownames (rf$importance [o [1:10],]))]
    rf.select10 <- randomForest (as.factor(click) ~ ., mtry=5, ntree=200, data=data.select10 [ m$split %in% 1:2,], do.trace=10)
    p.select10 <- predict (rf.select10, newdata=data.select10 [ m$split == 3,], type="prob") [,2]

    png ('rf-perfo-30.png')
    par (mfrow=c(2,1))
    plot (precCurve (data.select30$click [m$split == 3], p.select30, n=100, step=100), type='l', ylab="precision", xlab="population size (in hundreds)", main="precision grothw", ylim=c(0,0.5), sub='random forest; top 30 features')
    abline (h=(table (data.select30$click [m$split == 3])/sum(m$split == 3))[2], col='red')
    abline (h=0.1, col='green')

    plot (precCurve (data.select10$click [m$split == 3], p.select10, n=100, step=100), type='l', ylab="precision", xlab="population size (in hundreds)", main="precision grothw", ylim=c(0,0.5), sub='random forest; top 10 features')
    abline (h=(table (data$click [m$split == 3])/sum(m$split == 3))[2], col='red')
    abline (h=0.1, col='green')
    dev.off ()

    ## PLS regression
    n <- createplsmodel (click ~ . - open, data, ncomp=40)
    foo <- data [n$split == 2,]
    r <- c ()
    for (i in 1:20) r <- c (r, sapply (R2 (n$model, newdata=foo [sample (1:nrow (foo), nrow(foo), TRUE),])$val, FUN=I)[-1])
    r <- matrix (r, nrow=40)
    s <- apply (r, MARGIN=1, FUN=sum)
    plot (s, type='l')

    png ("PLS-perfo-on-test.png")
    p <- predict (n$model, newdata=foo, comps=1:20)
    plot (precCurve (foo$click, p, n=100, step=100), type='l', ylab="precision", xlab="population size (in hundreds)", main="precision grothw")
    p <- predict (n$model, newdata=foo, comps=1:10)
    lines (precCurve (foo$click, p, n=100, step=100), col='red')
    legend (80, 0.08, c ("10", "", "20"), lty=c(1, -1, 1), col=c('red', 'white', 'black'))
    dev.off ()
    
    png ("PLS-perfo.png")
    p <- predict (n$model.full, newdata=data [ n$split==3,], comps=1:20)
    plot (precCurve (data$click [n$split==3], p, n=100, step=100), type='l', sub="ncomp=20", main="PLS regression, 20 components", ylab="precision", xlab="population size (in hundreds)")
    dev.off ()
    
    ## PLS with interactions
    n <- createplsmodel (click ~ . - open + acountry:jcountry , data, ncomp=2, full=FALSE)
    foo <- data [n$split == 2,]
    r <- c ()
    for (i in 1:20) r <- c (r, sapply (R2 (n$model, newdata=foo [sample (1:nrow (foo), nrow(foo), TRUE),])$val, FUN=I)[-1])
    r <- matrix (r, nrow=40)
    s <- apply (r, MARGIN=1, FUN=sum)
    plot (s, type='l')

    p <- predict (n$model, newdata=foo, comps=1:15)
    plot (precCurve (foo$click, p, n=100, step=100), type='l')
    p <- predict (n$model, newdata=foo, comps=1:10)
    lines (precCurve (foo$click, p, n=100, step=100), col='red')
    p <- predict (n$model, newdata=data [ n$split==3,], comps=1:10)
    plot (precCurve (data$click [n$split==3], p, n=100, step=100), type='l')
}

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

plotPrecCurve <- function (
    binflag, score, n=100, step=100,
    target=list (value=0.1, col='green'),
    bootstrap=list (B=50, bounds=c(0.1 ,0.9), col='red')) {

    p <- precCurve2 (binflag=binflag, score=score, n=n, step=step)
    plot (p, type='l', col='black')
    if (! is.null (target)) 
        abline (h=target$value, col=target$col)
    if (! is.null (bootstrap)) {
        if (is.null (bootstrap$B)) bootstrap$B <- 50
        if (is.null (bootstrap$bounds)) bootstrap$bounds <- c (0.1, 0.9)
        if (is.null (bootstrap$col)) bootstrap$col <- 'red'
        b <- bootstrapPrecCurve (binflag=binflag, score=score, n=n, step=step,
                                 boot=bootstrap$B)
        for (x in bootstrap$bounds) {
            lines (apply (b, MARGIN=1, FUN=quantile, prob=x), col=bootstrap$col)
        }
    }
}

precCurve <- function (binflag, score, n=100, step=100) {
    fun <- aboveNthBiggerFun (score)
    ret <- c ()
    for (i in 1:n) {
        u <- i*step
        tbl <- table (binflag, fun (u)) #table (binflag, aboveNthBigger (score, u))
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
    
bootstrapPrecCurve <- function (binflag, score, n=100, step=100, bootstrap=50) {
    xs <- c ();
    for (i in 1:bootstrap) {
        s <- sample (seq_along(binflag), length (binflag), TRUE)
        xs <- c (xs, precCurve2 (binflag [s], score [s], n, step))
    }
    matrix (xs, ncol=bootstrap)
}

createplsmodel <- function (formula, data, ncomp=20, full=TRUE) {
    set.seed (1)
    trainprop <- 60
    testprop <- 20
    validprop <- 20
    split <- sample (1:3, nrow(data), TRUE, c (trainprop, testprop, validprop))
    
    traindb <- data [split == 1, ]
    testdb <- data [split == 2, ]
    validdb <- data [split == 3, ]
    
    list (
        model=plsr (formula, data=traindb, ncomp=ncomp),
        model.full=if (full) plsr (formula, data=data [split %in% 1:2, ], ncomp=ncomp),
        split=split,
        data=data)
}

testplsmodels <- function (model, compmax=10, limit=2000, B=10) {
    l <- list ()
    d <- model$data [model$split==2,]
    if (B == 1) {
        testdata <- d
        for (i in 1:compmax) {
            p <- predict (model$model, newdata=testdata, comps=1:i)
            o <- order (-p)
            tbl <- table (testdata$click, p >= p [o [limit]])
            l [[i]] <- t (t (tbl) / apply (tbl, MARGIN=2, FUN=sum))
        }
    } else {
        for (b in 1:B) {
            cat ("BOOTSTRAP", b)
            testdata <- d [sample (1:nrow (d), nrow (d), TRUE),]
            for (i in 1:compmax) {
                p <- predict (model$model, newdata=testdata, comps=1:i)
                o <- order (-p)
                tbl <- table (testdata$click, p >= p [o [limit]])
                if (b == 1) 
                    l [[i]] <- tbl
                else
                    l [[i]] <- l [[i]] + tbl
            }
        }
        for (i in 1:compmax) {
            tbl <- l [[i]]
            l [[i]] <- t (t (tbl) / apply (tbl, MARGIN=2, FUN=sum))                      
        }
    }
    l
}

# 
experience1 <- function () {
    m <- createplsmodel (click ~ ., data, ncomp=40)
    p <- predict (m$model, newdata=data [m$split==3,], ncomp=20)
    table (data$click [m$split==3], p > p [order (-p) [5000]]) # environ 10 %
    table (data$click [m$split==3], p > p [order (-p) [2000]]) # environ 13 %
}

experience2 <- function () {
    foo <- data.frame (click=m$data$click [m$split==1], unclass (m$model$scores))
    foo.valid <- data.frame (click=m$data$click [m$split==3], predict (m$model, newdata=data [m$split == 3,], type="scores", comps=1:40))
    weights <- ifelse (data$click [m$split == 1] == 1, 10, 1)
    n <- glm (click ~. - Comp.40 - Comp.37 - Comp.33 - Comp.34 - Comp.35 - Comp.30 - Comp.28 - Comp.23 - Comp.20 - Comp.17 - Comp.8 - Comp.25 - Comp.26 - Comp.31, data=foo, family=binomial(link = "logit"), weight=weights)
    p <- predict (n, newdata=foo.valid, type="response") # pas d'amélioration des performances
}

saveModel <- function (formula, data, id, split, ntree=200, mtry=5, prefix) {
    set.seed (1)
    n <- randomForest (formula, data=data [split != 3,], ntree=ntree, mtry=mtry, do.trace=TRUE)
    l <- list (model=n, data=data, split=split, seed=1, id=id)
    save (l, file=paste(prefix, 'rf.RDATA', sep=''))
    n
}

exportModel <- function (prefixin, prefixout) {
    load (paste (prefixin, 'rf.RDATA', sep=''))
    m <- l$model
    mtbl <- NULL
    for (i in 1:l$model$ntree) {
        tree <- getTree (m,i)
        mtbl <- rbind (mtbl, cbind (i, 1:nrow (tree), tree))
    }
    term.labels <- attr (m$terms, 'term.labels')
    term.table <- cbind (term.labels, seq_along (term.labels))
    data <- cbind (id=l$id,split=l$split, l$data)
    
    write.table (mtbl, quote=FALSE, row.name=FALSE, col.name=FALSE, sep='\t',
                 file=paste (prefixout, 'forest.tsv', sep=''))
    write.table (term.table, quote=FALSE, row.name=FALSE, col.name=FALSE, sep='\t',
                 file=paste (prefixout, 'termtable.tsv', sep=''))
    write.table (data, quote=FALSE, row.name=FALSE, col.name=FALSE, sep='\t',
                 file=paste (prefixout, 'data.tsv', sep=''));
    write.table (names (data), quote=FALSE, row.name=FALSE, col.name=FALSE, sep='\t',
                 file=paste (prefixout, 'columns.tsv', sep=''));
}
