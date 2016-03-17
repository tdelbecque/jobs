use strict;
use diagnostics;

my $h = <>;
print $h;
$" = "\t";
while (<>) {
    my ($id, $sectors, @rest) = split /\t/;
    my @s = split /;/, $sectors;
    for (@s) {
	print "$id\t$_\t@rest";
    }
}


