use strict;
use diagnostics;

my @S = ();
open FILE, "<$ARGV[0]" or die $!;
while (<FILE>) {
    chomp;
    push @S, $_;
}
       
close FILE;

$_ = <STDIN>;
print $_;
my %L;
while (<STDIN>) {
    my @f = split /","/;
    $L{$f[3]} = $_;
}

for (@S) {
    defined $L{$_} and print $L{$_}
}


