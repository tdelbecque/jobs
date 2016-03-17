#!/usr/bin/perl

use strict;
use diagnostics;

while (<>) {
    s!<EXTRA>.*<JOBSECTORS>(.*?)<.*?/EXTRA>!$1!;
    s/&amp;/&/g;
    print
}
