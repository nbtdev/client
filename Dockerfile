FROM httpd

COPY live /usr/local/apache2/htdocs
COPY httpd.conf /usr/local/apache2/conf/httpd.conf
