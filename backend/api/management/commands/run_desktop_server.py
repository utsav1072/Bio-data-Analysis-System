from django.core.management.base import BaseCommand
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Runs the Django server for the desktop app'

    def handle(self, *args, **options):
        # You can customize the port or other options here
        call_command('runserver', '127.0.0.1:8000')
