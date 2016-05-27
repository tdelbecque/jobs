use strict;
use diagnostics;

my %E = ();

open FILE, "<M_campaignlist_1.csv" or die $!;
<FILE>;
while (<FILE>) {
    my @f = split /","/;
    $E {$f[3]} = 1;
}
close FILE;

open FILE, "<$ARGV[0]" or die $!;
my $h = <FILE>;
print $h;
while (<FILE>) {
    my @f = split /\t/;
    print if defined $E {$f[1]}
}
close FILE;


