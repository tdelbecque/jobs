use strict;
use diagnostics;

my %ExcludedEmails;

if (open FILE, "<excludedEmails1") {
    while (<FILE>) {
	chomp;
	$ExcludedEmails {$_} = 1;
    }
    close FILE;
} else {
    print STDERR "NO MAIL TO EXCLUDE\n";
}

my %W;

open FILE, "<cc-weight" or die $!;
while (<FILE>) {
    chomp;
    my ($cand, $job, $w) = split /\t/;
    $W {"$cand$job"} = $w;
}
close FILE;

my %L = ();

my $header = <>;

sub max {
    my ($a, $b) = @_;
    ($a > $b) ? $a : $b;
}

my %V = ();

while (<>) {
    my %U = ();
    my ($email, $cand, $cc1, $cc2, $cc3) = m!"([^"]+@.+?)".+<COUNTRYCODE>(...).+>(...)</CC.+>(...)</CC.+>(...)</CC!;
    my $p1 = $W {"$cand$cc1"} || 0;
    my $p2 = $W {"$cand$cc2"} || 0;
    my $p3 = $W {"$cand$cc3"} || 0;
    my $p = $p1 + $p2 + $p3;
    #   $p = max (max ($p1, $p2), $p3);
    $p and (! defined $ExcludedEmails{$email}) and $L {$_} = $p;
    if ($p) {
        $W {"$cand$cc1"} and $U {"$cand$cc1"} = 1;
        $W {"$cand$cc2"} and $U {"$cand$cc2"} = 1;
        $W {"$cand$cc3"} and $U {"$cand$cc3"} = 1;
	$V {$_} ++ for keys %U;
    }
}

=for nothing

while (my ($k, $v) = each %V) {
    print "$k\t$v\n";
}

=cut

my @K = sort {$L {$b} <=> $L {$a} or $a cmp $b} keys %L;

print "$header";

for (1..2000) {
    print $K[$_];
}

