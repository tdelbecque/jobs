V=20160523

R -f sample.r
perl shuffle.pl < M_campaignlist_orig_1.csv > M_campaignlist_1.csv
perl shuffle.pl < M_campaignlist_orig_2.csv > M_campaignlist_2.csv
perl shuffle.pl < M_campaignlist_orig_3.csv > M_campaignlist_3.csv

perl extractOrderedMails.pl < M_campaignlist_2.csv > ml-sorted-emails-2
perl extractOrderedMails.pl < M_campaignlist_3.csv > ml-sorted-emails-3

perl sample.pl sample_H1 M_campaignlist_1.csv > M_campaignlist-H1.csv
perl liftSector.pl < M_campaignlist-H1.csv > M_campaignlist-$V-H1.csv

perl sample.pl sample_H2 M_campaignlist_1.csv > M_campaignlist-H2.csv
perl liftSector.pl < M_campaignlist-H2.csv > M_campaignlist-$V-H2.csv

perl addvariant.pl M_campaignlist-$V-H1.csv > M_campaignlist-$V-allvariants.csv
perl addvariant.pl M_campaignlist-$V-H2.csv | tail -n +2 >> M_campaignlist-$V-allvariants.csv

tail -n +2 M_campaignlist-$V-allvariants.csv | perl -ne '/"([^"]+@.+?)"/; print "$1\n"' > excludedEmails # (H1, H2)

perl excludeWithEmails.pl excludedEmails M_campaignlist_2.csv | perl sortWithEmails.pl ml-sorted-emails-2 | head -n 10001 > M_campaignlist-M.csv

#perl sample.pl sample_M M_campaignlist-M12.csv > M_campaignlist-M.csv
perl liftSector.pl < M_campaignlist-M.csv > M_campaignlist-$V-M.csv

perl addvariant.pl M_campaignlist-$V-M.csv | tail -n +2 >> M_campaignlist-$V-allvariants.csv

tail -n +2 M_campaignlist-$V-allvariants.csv | perl -ne '/"([^"]+@.+?)"/; print "$1\n"' > excludedEmails # (A1, A2, M)
perl excludeWithEmails.pl excludedEmails M_campaignlist_3.csv | perl sortWithEmails.pl ml-sorted-emails-3 | head -n 10001 > M_campaignlist-N.csv

#perl sample.pl sample_N M_campaignlist-N12.csv > M_campaignlist-N.csv
perl liftSector.pl < M_campaignlist-N.csv > M_campaignlist-$V-N.csv

perl addvariant.pl M_campaignlist-$V-N.csv | tail -n +2 >> M_campaignlist-$V-allvariants.csv

perl liftSector.pl < M_campaignlist-intern-H.csv > M_intern-$V-H.csv

cut -f 4 -d ',' M_campaignlist-$V-allvariants.csv | sort -u | wc -l
perl -ne 'chomp; $x = reverse $_; print "$x\n"' < M_campaignlist-$V-allvariants.csv| cut -f 1 -d ',' | sort | uniq -c

tail -n +2 M_campaignlist-H1.csv | perl extract-pairings.pl > C11-ctry2ctry-id-dist-H1.tsv
tail -n +2 M_campaignlist-H2.csv | perl extract-pairings.pl > C11-ctry2ctry-id-dist-H2.tsv
tail -n +2 M_campaignlist-M.csv | perl extract-pairings.pl > C11-ctry2ctry-id-dist-M.tsv
tail -n +2 M_campaignlist-N.csv | perl extract-pairings.pl > C11-ctry2ctry-id-dist-N.tsv

perl extract-id.pl < M_campaignlist-$V-allvariants.csv > jobids-C11

#cat jobs-C11.tsv | perl ~/jobs/postprocess/onesectorperline.pl | cut -f 1,2 | perl -ne 'print unless /:/' > C11-jobs-info.tsv
