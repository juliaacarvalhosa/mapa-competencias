
from django.contrib import admin

from .models import Feedback


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('item_title', 'item_type', 'name', 'created_at')
    list_filter = ('item_type', 'created_at')
    search_fields = ('item_title', 'name', 'add', 'remove', 'comments')
    readonly_fields = ('created_at',)
