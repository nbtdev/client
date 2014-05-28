client
======

NBT client

First, you need to get the API environment set up (if you intend to do 100% local development); otherwise, you can use the staging server for client development.

Assuming your NBT automation server environment is running on localhost and listening on port 8080 (the default), simply point your web server's docroot to the 'html5' project directory on your filesystem, and navigate to http://localhost -- you should see a login box.

If you are accessing a server environment for the first time (usually locally), the only user account in the database is 'admin', and the password WILL BE WHAT YOU FIRST ENTER. That is, there is no password, until you enter 'admin' (without quotes) in the Login field, and in the password field, whatever text you enter, will be used as the admin password on that server from that point on. If you ever want to reset the password, you'll need to edit the database to reset the admin password for development. 
 