#  Static Content Folder

In this folder, put all the files you want in the AWS S3 Bucket :
* so git clone here the git@github.com:gravitee-io/dist.gravitee.io.git git repo
* always take the las commit on `master` branch

The Homepage of this static website :
* Will be Hugo generated to be beautiful
* Will be a one page full site,
* will give explanations about everty resource made available through the AWS S3 Bucket http server
* will give fingerprint, GPG public keys to verify signatures, instructions on how to check dowownload integrity etc...
* All hugo themes for single pags : https://themes.gohugo.io/tags/single-page/
* I think the best hugo theme would be :
  * https://github.com/gesquive/slate (definitely the best,just re-brand to gravitee logo)
  * each Apache legacy server page which lists folders or files, should be replaced by a https://github.com/gesquive/slate single page
  * so for each folder of the https://dowownload.gravitee.io server, a single page like https://github.com/gesquive/slate, which gives all sort options (most used, by categories, etc...)
