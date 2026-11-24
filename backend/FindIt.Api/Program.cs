using FindIt.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSingleton<InMemoryFindItStore>();
builder.Services.AddSingleton<SmartMatchingService>();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseCors();
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "FindIt67 API" }));

app.Run();
