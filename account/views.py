from django.shortcuts import render
from django.views import View
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.shortcuts import redirect
from django.contrib.auth.mixins import LoginRequiredMixin

# Create your views here.


class Dashboard(LoginRequiredMixin, View):
    template_name='account/dashboard.html'

    def get(self, request):
        users=User.objects.all()
        return render(request, self.template_name, {'users': users})



class Login(View):
    template_name='account/login.html'

    def get(self, request):
        return render(request, self.template_name)
    
    def post(self, request):
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('dashboard')
        else:
            print('invalid user!')
        return render(request, self.template_name)
