use strict;
use diagnostics;

open FILE, "<usedmails.csv" or die $!;
my %M;
while (<FILE>) {
    chomp;
    $M {$_} = 1;
}

close FILE;

<>;

while (<>) {
    my @f = split /","/;
    print if $M {$f [3]};
}
