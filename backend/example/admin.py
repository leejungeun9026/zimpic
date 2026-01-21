from django.contrib import admin
from .models import Example

# Register your models here.
class ExampleAdmin(admin.ModelAdmin):
  search_fields = ['title']

admin.site.register(Example, ExampleAdmin)