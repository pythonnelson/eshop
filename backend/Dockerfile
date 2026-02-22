FROM python:latest  

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1 
 
RUN mkdir /app
WORKDIR /app
 
RUN pip install --upgrade pip 
COPY backend/requirements.txt  .
RUN pip install -r requirements.txt
 
COPY backend/ .

ARG SECRET_KEY
ARG DATABASE_URL

RUN python3 manage.py collectstatic --no-input

CMD ["gunicorn", "api.wsgi"]