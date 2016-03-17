V=20160314

perl sample.pl sample_A M_campaignlist-A-G.csv | perl liftSector.pl > M_campaignlist-$V-A.csv
perl sample.pl sample_E M_campaignlist-E-F.csv | perl liftSector.pl > M_campaignlist-$V-E.csv

perl addvariant.pl M_campaignlist-$V-A.csv > M_campaignlist-$V-allvariants.csv
perl addvariant.pl M_campaignlist-$V-E.csv | tail -n +2 >> M_campaignlist-$V-allvariants.csv

tail -n +2 M_campaignlist-$V-allvariants.csv | perl -ne '/"([^"]+@.+?)"/; print "$1\n"' > excludedEmails1

perl sample-ccbased.pl M_campaignlist-E-F.csv > M_campaignlist-tmp-F.csv
cat M_campaignlist-tmp-F.csv | perl liftSector.pl > M_campaignlist-$V-F.csv
perl addvariant.pl M_campaignlist-$V-F.csv | tail -n +2 >> M_campaignlist-$V-allvariants.csv

tail -n +2 M_campaignlist-$V-allvariants.csv | perl -ne '/"([^"]+@.+?)"/; print "$1\n"' > excludedEmails2

perl sample-ccsoft.pl M_campaignlist-A-G.csv | head -n 2001 | perl liftSector.pl > M_campaignlist-$V-G.csv
perl addvariant.pl M_campaignlist-$V-G.csv | tail -n +2 >> M_campaignlist-$V-allvariants.csv

#perl extract-id.pl < M_campaignlist-20160221035738-allvariants.csv > jobids-C3

#cut -f 4 -d ',' M_campaignlist-20160221035738-allvariants.csv | sort -u | wc -l
#perl -ne '($x) = /.*?"([^"]+@.+?)"/; print "$x\n"' <  M_campaignlist-20160221035738-allvariants.csv | sort -u | wc -l
#perl -ne 'chomp; $x = reverse $_; print "$x\n"' < M_campaignlist-20160221035738-allvariants.csv| cut -f 1 -d ',' | sort | uniq -c

perl liftSector.pl < M_campaignlist-intern-A.csv > M_intern-$V-A.csv
perl liftSector.pl < M_campaignlist-intern-E.csv > M_intern-$V-E.csv

perl sample.pl sample_A M_campaignlist-A-G.csv | tail -n +2 | perl extract-pairings.pl > ctry2ctry-id-dist-A.tsv
perl sample.pl sample_E M_campaignlist-E-F.csv | tail -n +2 | perl extract-pairings.pl > ctry2ctry-id-dist-E.tsv
cat M_campaignlist-tmp-F.csv | tail -n +2 | perl extract-pairings.pl > ctry2ctry-id-dist-F.tsv
perl sample-ccsoft.pl M_campaignlist-A-G.csv | tail -n +2 | perl extract-pairings.pl > ctry2ctry-id-dist-G.tsv




