FROM python:latest  

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1 
 
RUN mkdir /app
WORKDIR /app
 
RUN pip install --upgrade pip 
COPY requirements.txt  .
RUN pip install --no-cache-dir -r requirements.txt
 
COPY . .

ARG SECRET_KEY
ARG DATABASE_URL

RUN python3 manage.py collectstatic --no-input

CMD ["gunicorn", "example.wsgi"]