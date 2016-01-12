#!/usr/bin/perl
use strict;
use warnings;

my $directory = "$ENV{'HOME'}/campaigns/data/";
my $server = $ENV{'JOBSFEED_SERVER'};
my $port = $ENV{'JOBSFEED_PORT'};

my %currentCampaigns = ();
my %currentSectorsStats = ();
my %currentJobsFreqs = ();
my %currentJobsHist = ();
my %currentParameters = ();

opendir (DIR, $directory) or die $!;

while (my $file = readdir(DIR)) {
    $file =~ /^M_.*\d+\.csv$/ and $currentCampaigns {$file} = 1;
    $file =~ /sectors-\d+\.csv$/ and $currentSectorsStats {$file} = 1;
    $file =~ /jobsfreqs-\d+\.csv$/ and $currentJobsFreqs {$file} = 1;
    $file =~ /jobshist-\d+\.csv$/ and $currentJobsHist {$file} = 1;
    $file =~ /parameters-\d+\.csv$/ and $currentParameters {$file} = 1;
}

closedir (DIR);

my %newCampaigns = ();
my %newSectorsStats = ();
my %newJobsFreqs = ();
my %newJobsHist = ();
my %newParameters = ();

my $lzdir = '/var/landingzone/epfl_lz/download/campaigns/';
opendir (DIR, $lzdir) or die $!;

while (my $file = readdir(DIR)) {
    $file =~ /^M_.*\d+\.csv$/ and ! $currentCampaigns {$file} and $newCampaigns {$file} = 1;
    $file =~ /sectors-\d+\.csv$/ and ! $currentSectorsStats  {$file} and $newSectorsStats {$file} = 1;
    $file =~ /jobsfreqs-\d+\.csv$/ and ! $currentJobsFreqs {$file} and $newJobsFreqs {$file} = 1;
    $file =~ /jobshist-\d+\.csv$/ and ! $currentJobsHist {$file} and $newJobsHist {$file} = 1;
    $file =~ /parameters-\d+\.csv$/ and ! $currentParameters {$file} and $newParameters {$file} = 1;
}

closedir (DIR);

for (keys %newCampaigns) {
    system "mv $lzdir$_ $directory$_";
    system "scp $directory$_ jobs\@$server:lz/$_";
    system "rm -f $directory$_";
}

for (keys %newSectorsStats) {
    system "mv $lzdir$_ $directory$_";
    system "scp $directory$_ jobs\@$server:lz/$_";
    system "rm -f $directory$_";
}

for (keys %newJobsFreqs) {
    system "mv $lzdir$_ $directory$_";
    system "scp $directory$_ jobs\@$server:lz/$_";
    system "rm -f $directory$_";
}

for (keys %newJobsHist) {
    system "mv $lzdir$_ $directory$_";
    system "scp $directory$_ jobs\@$server:lz/$_";
    system "rm -f $directory$_";
}

for (keys %newParameters) {
    system "mv $lzdir$_ $directory$_";
    system "scp $directory$_ jobs\@$server:lz/$_";
    system "rm -f $directory$_";
}

sub notify {
    system "curl $server:$port/alert?msg=NEW_FILE_IN_LZ"
}

notify if keys %newCampaigns;
