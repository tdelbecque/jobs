$" = ',';
while (<>) {
    s/\r\n//;
    @xs = ();
    push @xs, "'$_'" for split "\t";
    print STDOUT "\t{@xs},\n"
}
