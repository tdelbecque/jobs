($file) = @ARGV;

($campaign, $variant) = $file =~ /([^-]+)-([^-]+)\.csv/;

open FILE, "<$file" or die $!;

while (<FILE>) {
    chomp;
    print "$_," . '"' . ($. == 1 ? 'VARIANT' : $variant) . '"' . "\n"
}


    
