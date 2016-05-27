print "rnk\temail\tid\tauth_ctry\tjob_ctry\tjobid\tdist\n";

while (<>) {
    ($email, $id, $a, $b, $c, $d, $d1, $d2, $d3) = m!.+"(.+\@.+?)".+<UID>(.+)</UID>.+(...)</COUNTRYCODE.+(...)</CC.+(...)</CC.+(...)</CC.+<DIST1>(\d+).+<DIST2>(\d+).+<DIST3>(\d+)!; 
    @B = split /","/;
    ($j1) = $B [26] =~ /(\d+)/;
    ($j2) = $B [30] =~ /(\d+)/;
    ($j3) = $B [34] =~ /(\d+)/;
    print "1\t$email\t$id\t$a\t$b\t$j1\t$d1\n2\t$email\t$id\t$a\t$c\t$j2\t$d2\n3\t$email\t$id\t$a\t$d\t$j3\t$d3\n"
}

