use strict;
use diagnostics;

my %E = ();
<>;
while (<>) {
    my ($score) = /<MLSCORE>(.+?)</;
    my @f = split /","/;
    $E {$f[3]} = [$score, $.];
}

my @F = sort {my ($A, $B) = @E {$a, $b}; (-$A->[0]) <=> (-$B->[0]) or $A->[1] <=> $B->[1] } keys %E;

$" = "\n";
print "@F";

