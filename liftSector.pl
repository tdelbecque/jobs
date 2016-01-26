#!/usr/bin/perl

use strict;
use diagnostics;

while (<>) {
    s!<UID.*<JOBSECTORS>(.*?)<.*?</TZ>!$1!;
    s/&amp;/&/g;
    print
}
