from django.shortcuts import render
from django.views import View
from django.contrib.auth.models import User
# Create your views here.


class Dashboard(View):
    template_name='account/dashboard.html'

    def get(self, request):
        users=User.objects.all()
        return render(request, self.template_name, {'users': users})



class Login(View):
    template_name='account/login.html'

    def get(self, request):
        return render(request, self.template_name)

