use strict;
use diagnostics;

my @I = ();
open FILE, "<shuffle" or die $!;
while (<FILE>) {
    chomp;
    push @I, $_ - 1
}
close FILE;

$_ = <>;
print $_;
my @L = ();
push @L, $_ while <>;

print "@L[@I]";


