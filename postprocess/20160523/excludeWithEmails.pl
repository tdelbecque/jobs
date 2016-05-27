use strict;
use diagnostics;

my %E = ();
open FILE, "<$ARGV[0]" or die $!;
while (<FILE>) {
    chomp;
    $E {$_} = 1;
}
close FILE;

open FILE, "<$ARGV[1]" or die $!;
$_ = <FILE>;
print $_;
while (<FILE>) {
    my @f = split /","/;
    $E {$f[3]} or print;
}
close FILE;
