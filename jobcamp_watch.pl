#!/usr/bin/perl
use strict;
use warnings;

my $directory = "$ENV{'HOME'}/campaigns/data/";
my $server = $ENV{'JOBSFEED_SERVER'};
my $port = $ENV{'JOBSFEED_PORT'};

my %currentCampaigns = ();
my %currentInternCampaigns = ();
my %currentSectorsStats = ();
my %currentJobsFreqs = ();
my %currentJobsHist = ();
my %currentParameters = ();
my %currentJobs = ();

opendir (DIR, $directory) or die $!;

while (my $file = readdir(DIR)) {
    $file =~ /^M_c.*\d+\.csv$/ and $currentCampaigns {$file} = 1;
    $file =~ /^M_i.*\d+\.csv$/ and $currentInternCampaigns {$file} = 1;
    $file =~ /sectors-\d+\.csv$/ and $currentSectorsStats {$file} = 1;
    $file =~ /jobsfreqs-\d+\.csv$/ and $currentJobsFreqs {$file} = 1;
    $file =~ /jobshist-\d+\.csv$/ and $currentJobsHist {$file} = 1;
    $file =~ /parameters-\d+\.csv$/ and $currentParameters {$file} = 1;
    $file =~ /jobsdenorm-\d+\.csv$/ and $currentJobs {$file} = 1;
}

closedir (DIR);

my %newCampaigns = ();
my %newInternCampaigns = ();
my %newSectorsStats = ();
my %newJobsFreqs = ();
my %newJobsHist = ();
my %newParameters = ();
my %newJobs = ();

my $lzdir = '/var/landingzone/epfl_lz/download/campaigns/';
opendir (DIR, $lzdir) or die $!;

while (my $file = readdir(DIR)) {
    $file =~ /^M_c.*\d+\.csv$/ and ! $currentCampaigns {$file} and $newCampaigns {$file} = 1;
    $file =~ /^M_i.*\d+\.csv$/ and ! $currentInternCampaigns {$file} and $newInternCampaigns {$file} = 1;
    $file =~ /sectors-\d+\.csv$/ and ! $currentSectorsStats  {$file} and $newSectorsStats {$file} = 1;
    $file =~ /jobsfreqs-\d+\.csv$/ and ! $currentJobsFreqs {$file} and $newJobsFreqs {$file} = 1;
    $file =~ /jobshist-\d+\.csv$/ and ! $currentJobsHist {$file} and $newJobsHist {$file} = 1;
    $file =~ /parameters-\d+\.csv$/ and ! $currentParameters {$file} and $newParameters {$file} = 1;
    $file =~ /jobsdenorm-\d+\.csv$/ and ! $currentJobs {$file} and $newJobs {$file} = 1;
}

closedir (DIR);

for (keys %newCampaigns) {
    #system "mv $lzdir$_ $directory$_";
    my $diagnosticFile = $_;
    $diagnosticFile =~ s/M_/Diagnostic_/;
    system "wc -l $lzdir$_ > $directory$diagnosticFile";
    system "file $lzdir$_ >> $directory$diagnosticFile";
    system "gpg --output $directory$_.gpg --encrypt --recipient jobs\@sodad.com $lzdir$_";
    system "scp $directory$_.gpg jobs\@$server:lz/$_.gpg";
    system "scp $directory$diagnosticFile jobs\@$server:lz/$diagnosticFile";
    system "rm -f $directory$diagnosticFile";
    system "rm -f $lzdir$_";
    system "rm -f $directory$_.gpg";
}

for (keys %newInternCampaigns) {
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

for (keys %newJobs) {
    system "scp $lzdir$_ jobs\@$server:lz/$_";
    system "rm -f $lzdir$_";
}

sub notify {
    system "curl $server:$port/alert?msg=NEW_FILE_IN_LZ"
}

notify if keys %newCampaigns;
