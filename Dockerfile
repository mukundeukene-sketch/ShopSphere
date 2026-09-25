FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["ShopSphere.API/ShopSphere.API.csproj", "ShopSphere.API/"]
RUN dotnet restore "ShopSphere.API/ShopSphere.API.csproj"

COPY . .
WORKDIR "/src/ShopSphere.API"

RUN dotnet publish "ShopSphere.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://0.0.0.0:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "ShopSphere.API.dll"]
