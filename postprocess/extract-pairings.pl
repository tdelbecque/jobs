print "rnk\temail\tid\tauth_ctry\tjob_ctry\tjobid\tdist\n";

while (<>) {
    ($email, $id, $a, $d1, $b, $c, $d, $d2, $d3, $j1, $j2, $j3) = m!.+"(.+\@.+?)".+<UID>(.+)</UID>.+(...)</COUNTRYCODE.+<DIST1>(\d+).+(...)</CC.+(...)</CC.+(...)</CC.+<DIST2>(\d+).+<DIST3>(\d+).+"(\d+)/.+"(\d+)/.+"(\d+)/!; 

    print "1\t$email\t$id\t$a\t$b\t$j1\t$d1\n2\t$email\t$id\t$a\t$c\t$j2\t$d2\n3\t$email\t$id\t$a\t$d\t$j3\t$d3\n"
}

