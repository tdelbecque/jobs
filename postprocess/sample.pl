#!/usr/bin/perl

use strict;
use diagnostics;

@ARGV == 2 or die "sample.pl indexfile campaignfile\n";
    
my %sample = (1 => 1);

open SAMPLE_FILE, "<$ARGV[0]" or die $!;

while (<SAMPLE_FILE>) {
    chomp;
    $sample {$_} = 1
}

close SAMPLE_FILE;

open CAMPAIGN_FILE, "<$ARGV[1]" or die $!;

while (<CAMPAIGN_FILE>) {
    print if $sample {$.}
}

close CAMPAIGN_FILE;
