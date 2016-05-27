V=20160510

R -f sample.r
perl shuffle.pl < M_campaignlist_orig_1.csv > M_campaignlist_1.csv
perl shuffle.pl < M_campaignlist_orig_2.csv > M_campaignlist_2.csv

perl filter-pairs.pl pair_profiles.csv > filtered_pair_profiles.csv
R -f apply-rf.r

#perl extractOrderedMails.pl < M_campaignlist_1.csv > ml-sorted-emails-1
perl extractOrderedMails.pl < M_campaignlist_2.csv > ml-sorted-emails-2

perl sample.pl sample_A1 M_campaignlist_1.csv > M_campaignlist-A1.csv
perl liftSector.pl < M_campaignlist-A1.csv > M_campaignlist-$V-A1.csv

perl sample.pl sample_A2 M_campaignlist_1.csv > M_campaignlist-A2.csv
perl liftSector.pl < M_campaignlist-A2.csv > M_campaignlist-$V-A2.csv

perl addvariant.pl M_campaignlist-$V-A1.csv > M_campaignlist-$V-allvariants.csv
perl addvariant.pl M_campaignlist-$V-A2.csv | tail -n +2 >> M_campaignlist-$V-allvariants.csv

tail -n +2 M_campaignlist-$V-allvariants.csv | perl -ne '/"([^"]+@.+?)"/; print "$1\n"' > excludedEmails # (A1, A2)

perl excludeWithEmails.pl excludedEmails M_campaignlist_1.csv | perl sortWithEmails.pl ml-sorted-emails-1 | head -n 5001 > M_campaignlist-L.csv
perl liftSector.pl < M_campaignlist-L.csv > M_campaignlist-$V-L.csv
perl addvariant.pl M_campaignlist-$V-L.csv | tail -n +2 >> M_campaignlist-$V-allvariants.csv
tail -n +2 M_campaignlist-$V-allvariants.csv | perl -ne '/"([^"]+@.+?)"/; print "$1\n"' > excludedEmails # (A1, A2, J)

perl excludeWithEmails.pl excludedEmails M_campaignlist_2.csv | perl sortWithEmails.pl ml-sorted-emails-2 | head -n 5001 > M_campaignlist-K.csv
perl liftSector.pl < M_campaignlist-K.csv > M_campaignlist-$V-K.csv
perl addvariant.pl M_campaignlist-$V-K.csv | tail -n +2 >> M_campaignlist-$V-allvariants.csv
tail -n +2 M_campaignlist-$V-allvariants.csv | perl -ne '/"([^"]+@.+?)"/; print "$1\n"' > excludedEmails # (A1, A2, J, K)

perl sample-ccsoft.pl M_campaignlist_1.csv | head -n 10001 > M_campaignlist-G-I.csv

perl sample.pl sample_G M_campaignlist-G-I.csv > M_campaignlist-G.csv
perl liftSector.pl < M_campaignlist-G.csv > M_campaignlist-$V-G.csv

perl sample.pl sample_I M_campaignlist-G-I.csv > M_campaignlist-I.csv
perl liftSector.pl < M_campaignlist-I.csv > M_campaignlist-$V-I.csv

perl addvariant.pl M_campaignlist-$V-G.csv | tail -n +2 >> M_campaignlist-$V-allvariants.csv
perl addvariant.pl M_campaignlist-$V-I.csv | tail -n +2 >> M_campaignlist-$V-allvariants.csv

perl liftSector.pl < M_campaignlist-intern-A.csv > M_intern-$V-A.csv
#perl liftSector.pl < M_campaignlist-intern-K.csv > M_intern-$V-K.csv

cut -f 4 -d ',' M_campaignlist-$V-allvariants.csv | sort -u | wc -l
perl -ne 'chomp; $x = reverse $_; print "$x\n"' < M_campaignlist-$V-allvariants.csv| cut -f 1 -d ',' | sort | uniq -c

tail -n +2 M_campaignlist-A1.csv | perl extract-pairings.pl > C10-ctry2ctry-id-dist-A1.tsv
tail -n +2 M_campaignlist-A2.csv | perl extract-pairings.pl > C10-ctry2ctry-id-dist-A2.tsv
tail -n +2 M_campaignlist-G.csv | perl extract-pairings.pl > C10-ctry2ctry-id-dist-G.tsv
tail -n +2 M_campaignlist-I.csv | perl extract-pairings.pl > C10-ctry2ctry-id-dist-I.tsv
tail -n +2 M_campaignlist-L.csv | perl extract-pairings.pl > C10-ctry2ctry-id-dist-L.tsv
tail -n +2 M_campaignlist-K.csv | perl extract-pairings.pl > C10-ctry2ctry-id-dist-K.tsv

perl extract-id.pl < M_campaignlist-$V-allvariants.csv > jobids-C10

#cat jobs-C10.tsv | perl ~/jobs/postprocess/onesectorperline.pl | cut -f 1,2 | perl -ne 'print unless /:/' > C10-jobs-info.tsv
