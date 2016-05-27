use strict;
use diagnostics;

<>;
while (<>) {
    my ($m, $j1, $j2, $j3) = (split /","/)[(3, 26, 30, 34)];
    my ($i1) = $j1 =~ /(\d+)/;
    my ($i2) = $j2 =~ /(\d+)/;
    my ($i3) = $j3 =~ /(\d+)/;
    print "1\t$m\t$i1\t0\n";
    print "2\t$m\t$i2\t0\n";
    print "3\t$m\t$i3\t0\n";
}
