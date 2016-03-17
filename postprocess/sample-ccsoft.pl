use strict;
use diagnostics;

my %ExcludedEmails;

if (open FILE, "<excludedEmails2") {
    while (<FILE>) {
	chomp;
	$ExcludedEmails {$_} = 1;
    }
    close FILE;
} else {
    print STDERR "NO MAIL TO EXCLUDE\n";
}

my %W;

open FILE, "<cc-weight-n" or die $!;
while (<FILE>) {
    chomp;
    my ($cand, $job, $w) = split /\t/;
    $W {"$cand$job"} = $w;
}
close FILE;

my %L = ();

my $header = <>;
print $header;

sub max {
    my ($a, $b) = @_;
    ($a > $b) ? $a : $b;
}

my %V = ();

while (<>) {
    my %U = ();
    my ($email, $cand, $cc1, $cc2, $cc3) = m!"([^"]+@.+?)".+<COUNTRYCODE>(...).+>(...)</CC.+>(...)</CC.+>(...)</CC!;
    if (! defined $ExcludedEmails{$email}) {
	my $p1 = $W {"$cand$cc1"} || 0;
	my $p2 = $W {"$cand$cc2"} || 0;
	my $p3 = $W {"$cand$cc3"} || 0;
	my $k = 0;
	if ($p1) {
	    $k = "$cand$cc1";
	} elsif ($p2) {
	    $k = "$cand$cc2";	    
	} elsif ($p3) {
	    $k = "$cand$cc3";
	}
	if ($k) {
#	    $V {$k} ++;
	    $W {$k} --; # to comment out for the stats
	    print $_;
	}
    }
}

=for nothing

open FILE, "<cc-weight" or die $!;
while (<FILE>) {
    chomp;
    my ($cand, $job, $w) = split /\t/;
    my $n = $V {"$cand$job"} || 0;
    print "$cand\t$job\t$w\t$n\n";
}
close FILE;

=cut
