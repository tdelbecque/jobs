$/ = undef;

$_ = <>;

@I = m!,"(\d+)/!gs;
 
%J = ();

for (@I) {
    $J {$_} = 1
}

for (keys %J) {
    print "$_\n";
}


