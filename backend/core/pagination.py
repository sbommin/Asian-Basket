from rest_framework.pagination import PageNumberPagination

class AnnouncementPagination(PageNumberPagination):
    page_size = 1              # show 1 per request (for marquee)
    page_size_query_param = "page_size"
    max_page_size = 5
